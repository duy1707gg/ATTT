package com.securevault.repository;

import com.securevault.entity.Folder;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {

    // Lấy thư mục gốc của người dùng (parent = null)
    List<Folder> findByOwnerAndParentIsNull(User owner);

    // Lấy thư mục con của một thư mục
    List<Folder> findByOwnerAndParent(User owner, Folder parent);

    // Lấy thư mục theo ID và owner
    Optional<Folder> findByIdAndOwner(Long id, User owner);

    // Kiểm tra thư mục tồn tại
    boolean existsByIdAndOwner(Long id, User owner);

    // Kiểm tra tên thư mục trùng trong cùng thư mục cha
    boolean existsByNameAndOwnerAndParent(String name, User owner, Folder parent);

    // Đếm số thư mục con
    int countByParent(Folder parent);
}
